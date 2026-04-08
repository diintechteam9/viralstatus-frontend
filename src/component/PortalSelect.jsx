import { useNavigate } from "react-router-dom";

const portals = [
  {
    title: "Admin Portal",
    subtitle: "Secured access for administrators",
    color: "#1e40af",
    bg: "#eff6ff",
    border: "#bfdbfe",
    loginPath: "/admin/login",
    registerPath: "/admin/register",
    registerLabel: "Register as Admin",
  },
  {
    title: "Client Portal",
    subtitle: "Access your brand dashboard",
    color: "#065f46",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    loginPath: "/client/login",
    registerPath: "/client/register",
    registerLabel: "Register as Client",
  },
  {
    title: "User Portal",
    subtitle: "Join campaigns and track earnings",
    color: "#9a3412",
    bg: "#fff7ed",
    border: "#fed7aa",
    loginPath: "/user/login",
    registerPath: "/user/register",
    registerLabel: "Register as User",
  },
];

export default function PortalSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10 px-4">

      {/* Header */}
      <div className="text-center mb-10">
        <img
          src="/Yovoai-logo.jpg"
          alt="YovoAI"
          style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }}
        />
        <h1 className="text-3xl font-bold text-gray-900">YovoAI</h1>
        <p className="text-gray-500 mt-1 text-sm">Select your portal to continue</p>
      </div>

      {/* Portal Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((p) => (
          <div
            key={p.title}
            className="bg-white rounded-lg shadow-md p-8 flex flex-col"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: p.color }}>
                {p.title}
              </h2>
              <p className="text-gray-600 mt-1 text-sm">{p.subtitle}</p>
            </div>

            {/* Login Button */}
            <button
              onClick={() => window.open(p.loginPath, "_blank")}
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 mb-4"
              style={{ backgroundColor: p.color }}
            >
              Login
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-4 mt-auto text-center space-y-2">
              <p className="text-gray-600 text-sm">Need to create an account?</p>
              <button
                onClick={() => window.open(p.registerPath, "_blank")}
                className="text-sm font-medium hover:underline"
                style={{ color: p.color }}
              >
                {p.registerLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Back */}
      <button
        onClick={() => navigate("/landingpage")}
        className="mt-8 text-gray-400 hover:text-gray-600 text-sm"
      >
        ← Return to Home
      </button>
    </div>
  );
}
