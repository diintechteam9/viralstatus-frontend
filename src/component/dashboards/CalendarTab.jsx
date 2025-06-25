import React, { useState } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const CalendarTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDateClick = (day) => {
    setSelectedDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSunday = (dayIndex) => {
    return dayIndex % 7 === 0;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth + firstDayOfMonth;

    for (let i = 0; i < totalDays; i++) {
      if (i < firstDayOfMonth) {
        days.push(
          <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>
        );
      } else {
        const day = i - firstDayOfMonth + 1;
        const isSelected =
          selectedDate &&
          selectedDate.getDate() === day &&
          selectedDate.getMonth() === currentDate.getMonth() &&
          selectedDate.getFullYear() === currentDate.getFullYear();

        const dayIndex = i;
        const isCurrentDay = isToday(day);
        const isCurrentSunday = isSunday(dayIndex);

        days.push(
          <div
            key={day}
            className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
              isSelected ? "bg-blue-100" : ""
            } ${isCurrentDay ? "bg-green-100" : ""}`}
            onClick={() => handleDateClick(day)}
          >
            <span
              className={`text-sm font-medium text-center ${
                isCurrentSunday
                  ? "text-red-500"
                  : isCurrentDay
                  ? "text-blue-600 font-bold"
                  : "text-gray-700"
              }`}
            >
              {day}
            </span>
          </div>
        );
      }
    }
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" />
          Calendar
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaChevronLeft />
          </button>
          <span className="text-lg font-semibold">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day, index) => (
          <div
            key={day}
            className={`bg-gray-50 p-2 text-center text-sm font-medium ${
              index === 0 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Selected Date:</h3>
          <p>{selectedDate.toDateString()}</p>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;
