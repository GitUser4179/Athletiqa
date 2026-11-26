import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import { BlockUserModal } from "./BlockUserModal";
import { useTranslation } from "react-i18next";

// User menu, guests go to login before block actions can open.
// onBlocked: called after a successful block. Default: leave the page (a blocked profile is no longer visible).
export function UserActionsMenu({ user, className = "", isAuthenticated = false, onBlocked }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Dropdown menu visibility.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Block-user confirmation modal visibility
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isMenuOpen]);

  // Close the menu, then open the block modal
  const handleBlockClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsMenuOpen(false);
    setIsBlockModalOpen(true);
  };

  const handleMenuClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsMenuOpen((open) => !open);
  };

  return (
    <>
      <div className={`relative ${className}`} ref={menuRef}>
        {/* Dropdown trigger */}
        <Button
          variant="none"
          onClick={handleMenuClick}
          title={!isAuthenticated ? t("Logga in för fler val") : undefined}
          className="!p-0 !rounded-none text-xl leading-none text-gray-700 hover:text-primary"
        >
          ⋯
        </Button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 min-w-[10rem] bg-surface border border-gray-300 rounded-xl shadow-md py-1 z-10 overflow-hidden">
            <Button
              variant="menuItem"
              onClick={handleBlockClick}
              className="text-gray-700"
            >
              {t("Blockera")}
            </Button>
          </div>
        )}
      </div>

      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        user={user}
        onConfirm={(blocked) => (onBlocked ? onBlocked(blocked) : navigate("/explore"))}
      />
    </>
  );
}
