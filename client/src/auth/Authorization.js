import { useEffect, useState } from "react";
import "./authorization.css";
import api from "../api/api";
import { notificationColors } from "../notifications/notificationTypes";
import Loader from "../loader/Loader";
import { validateInput } from "./validateInput";

const Authorization = ({ onClose, onLogin, type, onShowNotification }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(type === "login" ? "Вход" : "Регистрация");
  const [email, setEmail] = useState("");
  const [registration, setRegistration] = useState(type === "register");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [mainFieldDisplay, setMainFieldDisplay] = useState(true);
  const [firstStageButtonDisplay, setFirstStageButtonDisplay] = useState(true);
  const [passwordDisplay, setPasswordDisplay] = useState(false);

  // Для подтверждения email
  const [confirmStage, setConfirmStage] = useState(false);
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState(null);
  const [tempCodeId, setTempCodeId] = useState(null);

  useEffect(() => {
    setStatus(type === "login" ? "Вход" : "Регистрация");
    setRegistration(type === "register");
  }, [type]);

  const firstStage = async () => {
    if (!email || !validateInput(email)) {
      onShowNotification("Введите корректный email", notificationColors.error);
      return;
    }
    setLoading(true);
    setFirstStageButtonDisplay(false);

    try {
      const existsResponse = await api.get(`exists/${email}`);
      
      if (type === "login" && !existsResponse.data.exists) {
        onShowNotification("Такой email не зарегистрирован. Пожалуйста, зарегистрируйтесь.", notificationColors.error);
        setTimeout(() => onClose(), 3000);
        return;
      }

      if (type === "register" && existsResponse.data.exists) {
        onShowNotification("Такой email уже зарегистрирован. Пожалуйста, войдите в систему.", notificationColors.error);
        setTimeout(() => onClose(), 3000);
        return;
      }

      setPasswordDisplay(true);
    } catch (error) {
      console.error('First stage error:', error);
      onShowNotification("Ошибка при проверке email", notificationColors.error);
      setFirstStageButtonDisplay(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      onShowNotification("Заполните все поля", notificationColors.error);
      return;
    }

    if (registration && password !== repeatPassword) {
      onShowNotification("Пароли не совпадают", notificationColors.error);
      return;
    }

    setLoading(true);
    try {
      if (!registration) {
        const loginResponse = await api.post("login", { email, password });
        const userData = loginResponse.data.user;
        localStorage.setItem("token", loginResponse.data.accessToken);
        localStorage.setItem("refreshToken", loginResponse.data.refreshToken);
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem("userId", userData._id);
        onShowNotification(loginResponse.data.message, notificationColors.success);
        onLogin(userData);
        setStatus("Вы в системе");
        setMainFieldDisplay(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Регистрация: теперь ждем подтверждения email
        const registerResponse = await api.post("registration", { email, password });
        setUserId(registerResponse.data.userId);
        setTempCodeId(registerResponse.data.tempCodeId);
        setConfirmStage(true);
        setMainFieldDisplay(false);
        setPasswordDisplay(false);
        onShowNotification(registerResponse.data.message, notificationColors.success);
        // НЕ логиним пользователя и не работаем с userData!
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      onShowNotification(error.response?.data?.message || "Ошибка при входе/регистрации", notificationColors.error);
    } finally {
      setLoading(false);
    }
  };

  // Подтверждение email
  const handleConfirm = async () => {
    if (!code || !tempCodeId) return;
    setLoading(true);
    try {
      const res = await api.get(`/confirm/${code}/${tempCodeId}`);
      if (res.data.match) {
        onShowNotification("Email подтвержден! Теперь войдите в систему.", notificationColors.success);
        setTimeout(() => onClose(), 0);
        return;
      } else {
        onShowNotification("Неверный код подтверждения", notificationColors.error);
      }
    } catch (e) {
      onShowNotification("Ошибка подтверждения кода", notificationColors.error);
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка письма
  const handleResend = async () => {
    setLoading(true);
    try {
      await api.get(`/send/${email}`);
      onShowNotification("Письмо отправлено повторно", notificationColors.success);
    } catch {
      onShowNotification("Ошибка при отправке письма", notificationColors.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form form-width">
      <button onClick={onClose} className="close-button">
        ✕
      </button>
      <p className="form-title">{status}</p>
      {!confirmStage && mainFieldDisplay && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-field"
          type="email"
          placeholder="Введите email"
        />
      )}
      {!confirmStage && firstStageButtonDisplay && (
        <button onClick={firstStage} className="form-button">
          Продолжить
        </button>
      )}
      {!confirmStage && passwordDisplay && (
        <div className="full-width">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-field"
            type="password"
            placeholder="Введите пароль"
          />
          {registration && (
            <input
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="form-field"
              type="password"
              placeholder="Повторите пароль"
            />
          )}
          <button onClick={handleSubmit} className="form-button">
            {registration ? "Зарегистрироваться" : "Войти"}
          </button>
        </div>
      )}
      {confirmStage && (
        <div className="full-width">
          <p className="form-text">На вашу почту отправлен код подтверждения. Введите его ниже:</p>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            className="form-field"
            type="text"
            placeholder="Код подтверждения"
          />
          <button onClick={handleConfirm} className="form-button">Подтвердить</button>
          <button onClick={handleResend} className="form-button" style={{background: 'transparent', color: 'var(--app-color)', border: '1px solid var(--app-color)'}}>Отправить письмо повторно</button>
        </div>
      )}
      {loading && <Loader />}
    </div>
  );
};

export default Authorization;
