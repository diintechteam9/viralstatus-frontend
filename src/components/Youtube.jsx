import React from "react";

const Youtube = ({ data }) => {
  if (!data) return null;
  return (
    <div className="flex flex-col items-center mb-2">
      <img
        src={data.profilePic}
        alt="YouTube Channel"
        className="w-16 h-16 rounded-full mb-2"
      />
      <span className="font-medium">{data.channelName}</span>
      <span className="text-green-600 text-sm">Connected</span>
    </div>
  );
};

export default Youtube; 