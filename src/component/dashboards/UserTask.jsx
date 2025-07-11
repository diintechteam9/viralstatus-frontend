import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import ReelTaskDetail from "./ReelTaskDetail";

function UserTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const userId = localStorage.getItem("googleId");

  useEffect(() => {
    if (!userId) return;
    const fetchTasks = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pools/shared/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(Array.isArray(data.reels) ? data.reels : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [userId]);

  if (selectedTask) {
    return (
      <ReelTaskDetail
        task={selectedTask}
        onBack={() => setSelectedTask(null)}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h2>
          <p className="text-gray-600 text-lg">
            Manage your video content tasks
          </p>
        </div>

        {loading && <div className="text-center">Loading...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}

        <div className="space-y-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-6">
                {/* Video Thumbnail */}
                <div className="flex-shrink-0">
                  <video
                    src={task.s3Url}
                    controls
                    className="w-32 h-20 rounded-xl"
                  />
                </div>
                {/* Task Content */}
                <div className="flex-1 flex justify-between flex-row gap-3 ">
                  <div className="flex flex-col items-start ">
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                      Reel ID: {task.reelId}
                    </h3>
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                      campaignId: {task.campaigId}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Task Completed: {task.isTaskCompleted ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="flex mt-auto">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      onClick={() => setSelectedTask(task)}
                    >
                      View Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserTask;
