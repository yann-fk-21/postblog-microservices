const { createWriteStream } = require('node:fs');
const { mkdir, unlink } = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { randomUUID } = require('node:crypto');
const { status } = require('http-status');

const uploadDirectory = path.join(__dirname, '..', 'uploads-images');

const uploadImageToLocalStorage = async (reply, file) => {
  if (!file) {
    return reply
      .code(400)
      .send({ error: 'A file is required in the "file" field' });
  }

  const filename = `${randomUUID()}${path.extname(file.filename)}`;
  const filePath = path.join(uploadDirectory, filename);

  await mkdir(uploadDirectory, { recursive: true });
  try {
    await pipeline(file.file, createWriteStream(filePath, { flags: 'wx' }));
  } catch (error) {
    try {
      await unlink(filePath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        request.log.error(
          { err: cleanupError },
          'Failed to remove incomplete upload',
        );
      }
    }
    throw error;
  }

  if (file.file.truncated) {
    await unlink(filePath);
    return reply
      .code(413)
      .send({ error: 'The uploaded file exceeds the 10 MB limit' });
  }

  return filename;
};

const uploadImageToRemoteStorage = async (file) => {
  try {
    if (!file) {
      const error = new Error('A file is required in the "file" field');
      error.statusCode = status.BAD_REQUEST;
      throw error;
    }

    const fileBuffer = await file.toBuffer();
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileBuffer], { type: file.mimetype }),
      file.filename,
    );

    const response = await fetch('https://api.imghosting.in/upload', {
      method: 'POST',
      headers: { 'X-Free-API-Key': `${process.env.REMOTE_STORAGE_API_KEY}` },
      body: formData,
    });

    const { data } = await response.json();
    const imageUrl = data.url;
    return imageUrl;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const errorService = new Error("Remote image storage isn't available.");
    errorService.statusCode = status.BAD_GATEWAY;
    throw errorService;
  }
};

module.exports = { uploadImageToLocalStorage, uploadImageToRemoteStorage };
