import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, updateProfile, uploadProfileImage, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({ username: '', email: '' });
  const [status, setStatus] = useState({ msg: '', err: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ username: '', email: '' });
  const [dirty, setDirty] = useState(false);

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ msg: '', err: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imgStatus, setImgStatus] = useState({ msg: '', err: '' });
  const [imgUploading, setImgUploading] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated) {
      const initial = { username: user?.username || '', email: user?.email || '' };
      setForm(initial);
      setErrors({ username: '', email: '' });
      setDirty(false);
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const isDirty = (form.username.trim() !== (user?.username || '')) || (form.email.trim() !== (user?.email || ''));
    setDirty(!!isDirty);
  }, [form, user]);

  const validateField = (name, value) => {
    if (name === 'username') {
      if (!value.trim()) return 'Username cannot be blank.';
      if (value.trim().length > 50) return 'Username is too long.';
      return '';
    }
    if (name === 'email') {
      if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address.';
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((err) => ({ ...err, [name]: validateField(name, value) }));
  };

  const isFormValid = () => {
    return !validateField('username', form.username) && !validateField('email', form.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usernameErr = validateField('username', form.username);
    const emailErr = validateField('email', form.email);
    setErrors({ username: usernameErr, email: emailErr });
    if (usernameErr || emailErr) return;

    setStatus({ msg: '', err: '' });
    setSaving(true);
    try {
      await updateProfile(form.username.trim(), form.email.trim());
      setStatus({ msg: 'Profile updated successfully.', err: '' });
      setDirty(false);
    } catch (err) {
      const message = err?.email?.[0] || err?.detail || err?.message || JSON.stringify(err) || 'Update failed.';
      setStatus({ msg: '', err: message });
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((s) => ({ ...s, [name]: value }));
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwStatus({ msg: '', err: '' });
    if (pwForm.new_password.length < 8) {
      setPwStatus({ msg: '', err: 'New password must be at least 8 characters.' });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm) {
      setPwStatus({ msg: '', err: 'Passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await changePassword(pwForm.old_password, pwForm.new_password);
      if (res?.token) {
        localStorage.setItem('auth_token', res.token);
      }
      setPwStatus({ msg: 'Password changed successfully.', err: '' });
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      const message = err?.detail || err?.message || JSON.stringify(err) || 'Password change failed.';
      setPwStatus({ msg: '', err: message });
    } finally {
      setPwSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return setImgStatus({ msg: '', err: 'No image selected.' });
    setImgStatus({ msg: '', err: '' });
    setImgUploading(true);
    try {
      await uploadProfileImage(imageFile);
      setImgStatus({ msg: 'Profile image uploaded.', err: '' });
      setImageFile(null);
    } catch (err) {
      const message = err?.detail || err?.message || JSON.stringify(err) || 'Upload failed.';
      setImgStatus({ msg: '', err: message });
    } finally {
      setImgUploading(false);
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">{user?.username?.[0] || 'U'}</div>
        <div>
          <h2>{user?.username}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <section className="profile-section">
        <h3>Account</h3>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" type="text" value={form.username} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="save-btn" disabled={saving || !dirty || !isFormValid()}>{saving ? 'Saving…' : 'Save Changes'}</button>
            {status.msg && <div className="message-item message-success" style={{ position: 'static' }}>{status.msg}</div>}
            {status.err && <div className="message-item message-error" style={{ position: 'static' }}>{status.err}</div>}
          </div>
+          {errors.username && <div className="validation-error">{errors.username}</div>}
+          {!errors.username && form.username.trim().length > 0 && <div className="validation-ok">Looks good</div>}
+          {errors.email && <div className="validation-error">{errors.email}</div>}
+          {!errors.email && form.email.trim().length > 0 && <div className="validation-ok">Valid email</div>}

        </form>
      </section>

      <section className="profile-section">
        <h3>Profile Photo</h3>
        <form onSubmit={handleImageUpload}>
          <div className="form-group">
            <input type="file" accept="image/*" onChange={handleImageSelect} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="save-btn" disabled={imgUploading || !imageFile}>{imgUploading ? 'Uploading…' : 'Upload Image'}</button>
            {imgStatus.msg && <div className="message-item message-success" style={{ position: 'static' }}>{imgStatus.msg}</div>}
            {imgStatus.err && <div className="message-item message-error" style={{ position: 'static' }}>{imgStatus.err}</div>}
          </div>
+          {imageFile && <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>{imageFile.name} • {(imageFile.size / 1024 / 1024).toFixed(2)} MB</div>}

        </form>
      </section>

      <section className="profile-section">
        <h3>Security</h3>
        <form className="password-form" onSubmit={handlePwSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input name="old_password" type="password" value={pwForm.old_password} onChange={handlePwChange} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input name="new_password" type="password" value={pwForm.new_password} onChange={handlePwChange} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input name="confirm" type="password" value={pwForm.confirm} onChange={handlePwChange} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="save-btn" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Change Password'}</button>
            {pwStatus.msg && <div className="message-item message-success" style={{ position: 'static' }}>{pwStatus.msg}</div>}
            {pwStatus.err && <div className="message-item message-error" style={{ position: 'static' }}>{pwStatus.err}</div>}
          </div>
        </form>
      </section>

      <section className="profile-section">
        <h3>Preferences</h3>
        <div className="form-group">
          <label>Theme</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>Current: {theme}</span>
            <button className="btn" onClick={(e) => { e.preventDefault(); toggleTheme(); }}>Toggle Theme</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
