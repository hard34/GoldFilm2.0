import "./notification.css";

const Notification = ({ text, color }) => {
  return (
    <div
      className="notification"
      style={{ color, border: `1px solid ${color}` }}
    >
      {text}
    </div>
  );
};

export default Notification;
