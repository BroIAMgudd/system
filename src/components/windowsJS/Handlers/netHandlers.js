export const deleteTaskHandle = (socket, removeTask) => {
  socket.on('deleteTask', (id) => {
    removeTask(id);
  });
};

export const addFileTaskHandle = (socket, setState) => {
  socket.on('addNetworkProcess', (task) => {
    setState((prevState) => ({
      networkProcesses: [...prevState.networkProcesses, task],
      selectedTask: task.id
    }));
  });
};

export const setTasksHandle = (socket, setState) => {
  socket.on('setNetworkProcesses', (tasks) => {
    setState({ 
      networkProcesses: tasks,
      selectedTask: 0
    });
  });
};