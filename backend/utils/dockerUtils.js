const Docker = require('dockerode');
const docker = new Docker();

module.exports = {
  listContainers: async () => {
    return await docker.listContainers({ all: true });
  },

  stopContainer: async (containerId) => {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
  },

  getContainerInfo: async (containerId) => {
    const container = docker.getContainer(containerId);
    return await container.inspect();
  }
};
