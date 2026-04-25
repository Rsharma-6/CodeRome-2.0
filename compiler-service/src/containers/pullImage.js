const { docker } = require('./containerFactory');
const logger = require('../config/logger');

const pulledImages = new Set();

async function pullImage(imageName) {
  if (pulledImages.has(imageName)) return; // already pulled in this session

  try {
    const images = await docker.listImages();
    const exists = images.some(img =>
      img.RepoTags && img.RepoTags.some(tag => tag === imageName)
    );
    if (exists) {
      pulledImages.add(imageName);
      return;
    }
  } catch {
    // if listing fails, proceed to pull
  }

  logger.info('Pulling image', { image: imageName });
  await new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err, output) => {
        if (err) return reject(err);
        pulledImages.add(imageName);
        logger.info('Image ready', { image: imageName });
        resolve(output);
      });
    });
  });
}

module.exports = pullImage;
