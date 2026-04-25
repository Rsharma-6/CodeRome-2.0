// Decodes Docker's multiplexed stream format
// Each chunk: [type(1B), padding(3B), length(4B), payload(length B)]
const DOCKER_STREAM_HEADER_SIZE = 8;

function decodeDockerStream(buffer) {
  let offset = 0;
  const output = { stdout: '', stderr: '' };

  while (offset < buffer.length) {
    if (offset + DOCKER_STREAM_HEADER_SIZE > buffer.length) break;

    const typeOfStream = buffer[offset];
    const length = buffer.readUInt32BE(offset + 4);
    offset += DOCKER_STREAM_HEADER_SIZE;

    if (offset + length > buffer.length) break;

    if (typeOfStream === 1) {
      output.stdout += buffer.toString('utf-8', offset, offset + length);
    } else if (typeOfStream === 2) {
      output.stderr += buffer.toString('utf-8', offset, offset + length);
    }

    offset += length;
  }

  return output;
}

module.exports = decodeDockerStream;
