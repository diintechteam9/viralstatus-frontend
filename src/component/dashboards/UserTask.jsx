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
        // Only include tasks where isTaskCompleted is false
        const filteredTasks = (
          Array.isArray(data.reels) ? data.reels : []
        ).filter((task) => !task.isTaskCompleted);
        setTasks(filteredTasks);
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
    <div className="w-full min-h-screen bg-gray-50 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Tasks
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg">
            Manage your video content tasks
          </p>
        </div>

        {loading && <div className="text-center">Loading...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}

        <div className="space-y-4 sm:space-y-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {/* Video Thumbnail */}
                <div className="flex-shrink-0">
                  <video
                    src={task.s3Url}
                    controls
                    className="w-full sm:w-32 h-20 rounded-lg sm:rounded-xl"
                  />
                </div>
                {/* Task Content */}
                <div className="flex-1 flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex flex-col items-start">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight mb-1">
                      Reel ID: {task.reelId}
                    </h3>
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900 leading-tight mb-2">
                      campaignId: {task.campaigId}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                      Task Completed: {task.isTaskCompleted ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="flex sm:mt-auto">
                    <button
                      className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors duration-200 w-full sm:w-auto"
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
