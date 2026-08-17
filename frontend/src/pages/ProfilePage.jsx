import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";
import Modal from "../components/Modal";

function ProfilePage() {
  const { user, logout, login, token } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSavingAccount(true);
    setAccountError("");
    setAccountSuccess(false);

    try {
      const response = await api.put("/user/me", {
        name: name.trim(),
        email: email.trim(),
      });
      // Update local storage context
      login(token, response.data.user);
      setAccountSuccess(true);
      setTimeout(() => setAccountSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setAccountError(
        err.response?.data?.message || "Failed to update profile details."
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      await api.put("/user/password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setPasswordError(
        err.response?.data?.message || "Failed to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/user/me");
      setIsDeleteOpen(false);
      logout();
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-8">Profile Settings</h1>

      <div className="space-y-10 max-w-xl">
        {/* Account Details Form */}
        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-ink mb-4 border-b border-border pb-2">
            Account Details
          </h2>
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {accountError && (
              <div className="text-danger text-sm font-medium">{accountError}</div>
            )}
            {accountSuccess && (
              <div className="text-success text-sm font-medium">
                Changes saved successfully.
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="text-xs py-2 mt-2"
              isLoading={savingAccount}
              disabled={savingAccount}
            >
              Save Changes
            </Button>
          </form>
        </section>

        {/* Change Password Form */}
        <section className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-ink mb-4 border-b border-border pb-2">
            Change Password
          </h2>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border bg-background rounded px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {passwordError && (
              <div className="text-danger text-sm font-medium">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-success text-sm font-medium">
                Password updated successfully.
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="text-xs py-2 mt-2"
              isLoading={savingPassword}
              disabled={savingPassword}
            >
              Update Password
            </Button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50/50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Danger Zone</h2>
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            Once you delete your account, all your uploaded PDFs, summaries, and test history will be permanently erased.
          </p>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="text-xs py-2"
              onClick={() => logout()}
            >
              Log out
            </Button>
            <Button
              variant="danger"
              className="text-xs py-2"
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Account?"
      >
        <p className="text-sm text-ink-muted leading-relaxed mb-6">
          Are you absolutely sure you want to delete your StudyVault account? This action is irreversible. All data will be lost.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={deleting}
          >
            Yes, Delete Account
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default ProfilePage;
