import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../shared/ui/modal";
import { Button } from "../../../shared/ui/button";
import { Avatar } from "../../../shared/ui/avatar";
import { getBlockedUsers, unblockUser } from "../../block-user";

export default function BlockedUsersModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reload the list every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    setError("");
    getBlockedUsers()
      .then((data) => !cancelled && setUsers(data))
      .catch(() => !cancelled && setError(t("Kunde inte hämta listan, försök igen.")))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const handleUnblock = async (user) => {
    try {
      await unblockUser(user.type, user.publicProfileId);
      setUsers((prev) =>
        prev.filter((u) => !(u.type === user.type && u.publicProfileId === user.publicProfileId)),
      );
    } catch {
      setError(t("Kunde inte ta bort blockeringen, försök igen."));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-primary">
          {t("Blockerade användare")}
        </h2>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isLoading ? (
          <p className="text-sm text-gray-500">{t("Laddar…")}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">{t("Du har inte blockerat någon.")}</p>
        ) : (
          <div className="flex flex-col">
            {users.map((user) => (
              <div
                key={`${user.type}-${user.publicProfileId}`}
                className="flex items-center justify-between py-4 border-b border-gray-300 last:border-b-0"
              >
                {/* Left: avatar + name/role */}
                <div className="flex items-center gap-3">
                  <Avatar src={user.photoUrl} alt={user.name} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">{user.name}</span>
                    <span className="text-sm text-gray-500">
                      {user.type === "sponsor" ? t("Sponsor") : t("Atlet")}
                    </span>
                  </div>
                </div>

                {/* Right: unblock button */}
                <Button
                  variant="outline"
                  onClick={() => handleUnblock(user)}
                  className="px-6 py-2 font-medium"
                >
                  {t("Ta bort blockering")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
