import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamMember, TeamRole } from "@/contexts/team/team.types";
import type { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import type { useTeamActions } from "@/features/team/hooks/useTeamActions";
import {
  X,
  Crown,
  Edit3,
  Trash2,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface MemberDetailPanelProps {
  member: TeamMember;
  teamId: string;
  permissions: ReturnType<typeof useManagementPermissions>;
  actions: ReturnType<typeof useTeamActions>;
  onClose: () => void;
}

const ROLE_OPTIONS = ["PLAYER", "COACH", "ANALYST", "MANAGER"] as const;

const ROLE_COLORS: Record<TeamRole, string> = {
  PLAYER: "text-green-400 bg-green-500/10 border-green-500/20",
  COACH: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ANALYST: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  MANAGER: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export default function MemberDetailPanel({
  member,
  permissions,
  actions,
  onClose,
}: MemberDetailPanelProps) {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    email: member.email ?? "",
    role: member.role,
  });

  const canEditProfile = permissions.canEditMemberProfile(member);
  const canEditRole = permissions.canEditMemberRole();
  const canKick = permissions.canKickMember(member);
  const canTransfer = permissions.canTransferOwnership(member);
  const canLeave = permissions.canLeave(member);

  const handleSave = async () => {
    // TODO: Implement save logic with actions
    setIsEditing(false);
  };

  const handleKick = () => {
    if (
      confirm(
        t("management.confirm_kick", { nickname: member.nickname })
      )
    ) {
      actions.kickMember(member);
      onClose();
    }
  };

  const handleTransfer = () => {
    if (
      confirm(
        t("management.confirm_transfer", { nickname: member.nickname })
      )
    ) {
      actions.promoteToOwner(member);
      onClose();
    }
  };

  const handleLeave = () => {
    if (confirm(t("management.confirm_leave"))) {
      actions.leaveTeam();
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-neutral-800">
        <h2 className="text-lg font-semibold text-white">
          {t("management.member_details")}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable p-6 space-y-6">
        {/* Member Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-neutral-800">
          <img
            src={member.avatarUrl}
            alt={member.nickname}
            className="w-20 h-20 rounded-2xl object-cover mb-4"
          />
          <h3 className="text-xl font-semibold text-white mb-2">
            {member.nickname}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {member.isOwner && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium">
                <Crown className="w-4 h-4" />
                Owner
              </span>
            )}
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium ${ROLE_COLORS[member.role as TeamRole]}`}
            >
              {member.role}
            </span>
          </div>
        </div>

        {/* Personal Information */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {t("management.personal_information")}
            </h3>
            {canEditProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                {t("common.edit")}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Field
              label={t("management.first_name")}
              value={formData.firstName}
              onChange={(v) => setFormData({ ...formData, firstName: v })}
              editable={isEditing && canEditProfile}
            />
            <Field
              label={t("management.last_name")}
              value={formData.lastName}
              onChange={(v) => setFormData({ ...formData, lastName: v })}
              editable={isEditing && canEditProfile}
            />
            <Field
              label={t("management.email")}
              value={formData.email}
              onChange={(v) => setFormData({ ...formData, email: v })}
              editable={isEditing && canEditProfile}
              type="email"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: member.firstName ?? "",
                    lastName: member.lastName ?? "",
                    email: member.email ?? "",
                    role: member.role,
                  });
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}
        </section>

        {/* Role Management */}
        {canEditRole && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-4">
              {t("management.role")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    // TODO: Implement role change
                    setFormData({ ...formData, role });
                  }}
                  className={`
                    px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${
                      formData.role === role
                        ? ROLE_COLORS[role]
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    }
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Ownership Transfer */}
        {canTransfer && (
          <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-1">
                  {t("management.transfer_ownership")}
                </h3>
                <p className="text-xs text-amber-400/70">
                  {t("management.transfer_ownership_description")}
                </p>
              </div>
            </div>
            <button
              onClick={handleTransfer}
              className="w-full px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors"
            >
              {t("management.transfer_to_member")}
            </button>
          </section>
        )}

        {/* Danger Zone */}
        {(canKick || canLeave) && (
          <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">
                  {t("management.danger_zone")}
                </h3>
                <p className="text-xs text-red-400/70">
                  {t("management.danger_zone_description")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {canKick && (
                <button
                  onClick={handleKick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("management.kick_member")}
                </button>
              )}
              {canLeave && (
                <button
                  onClick={handleLeave}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t("management.leave_team")}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  type?: "text" | "email";
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 mb-1.5">
        {label}
      </label>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
        />
      ) : (
        <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-800 rounded-lg text-sm text-neutral-300">
          {value || <span className="text-neutral-600">—</span>}
        </div>
      )}
    </div>
  );
}
