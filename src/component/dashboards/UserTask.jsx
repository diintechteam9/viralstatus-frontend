import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import ReelTaskDetail from "./ReelTaskDetail";

function UserTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const userData = JSON.parse(localStorage.getItem("mobileUserData") || "{}");
  const userId = userData.googleId || localStorage.getItem("googleId");

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
          {tasks.length === 0 && !loading && !error && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                No reels found
              </h3>
              <p className="text-slate-600">
                You have no assigned reels at the moment. Check back later for
                new tasks.
              </p>
            </div>
          )}
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Video */}
                <div className="flex-shrink-0">
                  <video src={task.s3Url} controls className="w-full sm:w-28 h-20 rounded-lg object-cover bg-black" />
                </div>
                {/* Info */}
                <div className="flex-1 flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-base">{task.campaignName || "Campaign Task"}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Credits: <span className="font-bold text-green-600">{task.credits || 0} pts</span></p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      task.isTaskComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.isTaskComplete ? "✓ Completed" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-end">
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
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
