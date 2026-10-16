"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { authenticatedFetch } from "@/lib/api";

interface AdminUserResponse {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] =
    useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        "http://localhost:8080/api/admin/users"
      );

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Could not load users."
        );
      }

      const data: AdminUserResponse[] =
        await response.json();

      setUsers(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    user: AdminUserResponse
  ) {
    setUpdatingUserId(user.id);
    setError("");

    try {
      const response = await authenticatedFetch(
        `http://localhost:8080/api/admin/users/${user.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: !user.enabled,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ??
            "Could not update user status."
        );
      }

      const updatedUser: AdminUserResponse =
        await response.json();

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id
            ? updatedUser
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRoleChange(
    user: AdminUserResponse,
    role: string
  ) {
    setUpdatingUserId(user.id);
    setError("");

    try {
      const response = await authenticatedFetch(
        `http://localhost:8080/api/admin/users/${user.id}/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roles: [role],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ??
            "Could not update user role."
        );
      }

      const updatedUser: AdminUserResponse =
        await response.json();

      setUsers((current) =>
        current.map((item) =>
          item.id === updatedUser.id
            ? updatedUser
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <AppShell title="Admin">
      <div className="admin-users-page">
        <div className="admin-users-header">
          <span className="page-eyebrow">
            ADMINISTRATION
          </span>

          <h1>User management</h1>

          <p>
            Manage ClutchMetrics users, account
            status and permissions.
          </p>
        </div>

        {error && (
          <div className="page-error">
            {error}
          </div>
        )}

        {accessDenied ? (
          <div className="admin-access-denied">
            <h2>Access denied</h2>

            <p>
              Your account does not have
              administrator permissions.
            </p>
          </div>
        ) : loading ? (
          <div className="admin-loading">
            Loading users...
          </div>
        ) : (
          <div className="admin-users-card">
            <div className="admin-users-summary">
              <div>
                <span>Total users</span>
                <strong>{users.length}</strong>
              </div>

              <div>
                <span>Active</span>
                <strong>
                  {
                    users.filter(
                      (user) => user.enabled
                    ).length
                  }
                </strong>
              </div>

              <div>
                <span>Disabled</span>
                <strong>
                  {
                    users.filter(
                      (user) => !user.enabled
                    ).length
                  }
                </strong>
              </div>

              <div>
                <span>Admins</span>
                <strong>
                  {
                    users.filter((user) =>
                      user.roles.includes(
                        "ADMIN"
                      )
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-name">
                          <strong>
                            {user.username}
                          </strong>

                          <span>
                            ID #{user.id}
                          </span>
                        </div>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <select
                          className="admin-role-select"
                          value={
                            user.roles.includes(
                              "ADMIN"
                            )
                              ? "ADMIN"
                              : "USER"
                          }
                          disabled={
                            updatingUserId ===
                            user.id
                          }
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value
                            )
                          }
                        >
                          <option value="USER">
                            USER
                          </option>

                          <option value="ADMIN">
                            ADMIN
                          </option>
                        </select>
                      </td>

                      <td>
                        <span
                          className={
                            user.enabled
                              ? "admin-status active"
                              : "admin-status disabled"
                          }
                        >
                          {user.enabled
                            ? "Active"
                            : "Disabled"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            user.enabled
                              ? "admin-status-button disable"
                              : "admin-status-button enable"
                          }
                          disabled={
                            updatingUserId ===
                            user.id
                          }
                          onClick={() =>
                            handleStatusChange(
                              user
                            )
                          }
                        >
                          {updatingUserId ===
                          user.id
                            ? "Updating..."
                            : user.enabled
                              ? "Disable"
                              : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}