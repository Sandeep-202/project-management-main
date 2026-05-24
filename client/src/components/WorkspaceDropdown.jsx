import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";

import {
  useOrganizationList,
  useClerk,
} from "@clerk/clerk-react";

function WorkspaceDropdown() {
  const {
    setActive,
    userMemberships,
    isLoaded,
  } = useOrganizationList({
    userMemberships: true,
  });

  const { openCreateOrganization } = useClerk();

  const { workspaces = [] } = useSelector(
    (state) => state.workspace || {}
  );

  const currentWorkspace = useSelector(
    (state) => state.workspace?.currentWorkspace || null
  );

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSelectWorkspace = async (organizationId) => {
    try {
      await setActive({ organization: organizationId });

      dispatch(setCurrentWorkspace(organizationId));

      setIsOpen(false);

      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  /* =========================
     CLOSE DROPDOWN
  ========================= */

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  /* =========================
     SET ACTIVE WORKSPACE
  ========================= */

  useEffect(() => {
    if (currentWorkspace && isLoaded) {
      setActive({
        organization: currentWorkspace.id,
      });
    }
  }, [currentWorkspace, isLoaded]);

  return (
    <div className="relative m-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-sm">
              {currentWorkspace?.name || "Select Workspace"}
            </p>

            <p className="text-xs text-gray-500">
              {workspaces.length} workspace
              {workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 bg-white border rounded shadow-lg top-full left-0">
          <div className="p-2">
            <p className="text-xs text-gray-500 uppercase mb-2 px-2">
              Workspaces
            </p>

            {userMemberships?.data?.map(({ organization }) => (
              <div
                key={organization.id}
                onClick={() =>
                  onSelectWorkspace(organization.id)
                }
                className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100"
              >
                <img
                  src={organization.imageUrl}
                  alt={organization.name}
                  className="w-6 h-6 rounded"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {organization.name}
                  </p>
                </div>

                {currentWorkspace?.id === organization.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </div>
            ))}
          </div>

          <hr />

          <div
            onClick={() => {
              openCreateOrganization();
              setIsOpen(false);
            }}
            className="p-2 cursor-pointer hover:bg-gray-100"
          >
            <p className="flex items-center text-xs gap-2 text-blue-600">
              <Plus className="w-4 h-4" />
              Create Workspace
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceDropdown;