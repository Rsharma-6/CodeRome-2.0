const Docker = require('dockerode');

const docker = new Docker();

async function createContainer(image, cmd, tempDir) {
  return docker.createContainer({
    Image: image,
    Cmd: ['sh', '-c', cmd],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    HostConfig: {
      Memory: 256 * 1024 * 1024, // 256MB
      MemorySwap: 256 * 1024 * 1024,
      NetworkMode: 'none', // security: no outbound network
      Binds: [`${tempDir}:/code:ro`],
      CpuPeriod: 100000,
      CpuQuota: 50000, // 50% of one CPU
    },
  });
}

module.exports = { createContainer, docker };
