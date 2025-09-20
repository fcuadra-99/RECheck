"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Edit2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Profile {
  id: string;
  fname: string;
  lname: string;
  email: string;
  org: string;
  role: string;
  category: string;
  avatar: string;
}

const ROLE_OPTIONS = [
  "Admin",
  "Admin Assistant",
  "Researcher",
  "Reviewer",
  "Chairperson",
];
const CATEGORY_OPTIONS = ["Undergraduate", "Graduate", "External"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) return console.error(error);

      const usersWithAvatar = data.map((user) => {
        const publicUrl =
          supabase.storage.from("profiles").getPublicUrl(`${user.id}/pfp.png`)
            .data.publicUrl;
        return { ...user, avatar: publicUrl || "" };
      });

      setUsers(usersWithAvatar);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fname.toLowerCase().includes(search.toLowerCase()) ||
      u.lname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.org.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesCategory = categoryFilter ? u.category === categoryFilter : true;

    return matchesSearch && matchesRole && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Dialog handlers
  const openEditDialog = (user: Profile) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        fname: editingUser.fname,
        lname: editingUser.lname,
        email: editingUser.email,
        org: editingUser.org,
        role: editingUser.role,
        category: editingUser.role === "Researcher" ? editingUser.category : "",
      })
      .eq("id", editingUser.id);

    if (error) {
      toast.error("Failed to update user");
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? editingUser : u))
      );
      toast.success("User updated successfully!");
      setEditingUser(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;

    const { error } = await supabase.from("profiles").delete().eq("id", editingUser.id);
    if (error) {
      toast.error("Failed to delete user");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== editingUser.id));
      toast.success("User deleted successfully!");
      setEditingUser(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: User Management</h1>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input
          placeholder="Search by name, email, or organization"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <Select
          value={roleFilter ?? "all"}
          onValueChange={(val) => setRoleFilter(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter ?? "all"}
          onValueChange={(val) => setCategoryFilter(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-48 bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
              : paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.fname[0]}
                        {user.lname[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.fname + " " + user.lname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.org}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-center px-2 mt-4">
          <div className="flex items-center space-x-6 lg:space-x-8 text-center">
            {/* Rows per page */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current page info */}
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>

      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit User</DialogTitle>
          </DialogHeader>

          {/* Top section: Avatar + Name Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 items-start">
            {/* Avatar on left, spanning 2 rows, match height of inputs */}
            {editingUser && (
              <div className="row-span-2 flex items-start justify-center">
                <Avatar className="h-[120px] w-[120px] m-1 border-2 border-black">
                  <AvatarImage src={editingUser.avatar} />
                  <AvatarFallback>
                    {editingUser.fname[0]}
                    {editingUser.lname[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* First Name */}
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium mb-1">First Name</label>
              <Input
                value={editingUser?.fname || ""}
                onChange={(e) =>
                  setEditingUser((prev) => (prev ? { ...prev, fname: e.target.value } : null))
                }
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium mb-1">Last Name</label>
              <Input
                value={editingUser?.lname || ""}
                onChange={(e) =>
                  setEditingUser((prev) => (prev ? { ...prev, lname: e.target.value } : null))
                }
              />
            </div>
          </div>

          <div className="border-t mt-4 pt-0 flex"></div>

          {/* Other Inputs */}
          <div className="mt-4 space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Email</label>
              <Input
                value={editingUser?.email || ""}
                onChange={(e) =>
                  setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Organization</label>
              <Input
                value={editingUser?.org || ""}
                onChange={(e) =>
                  setEditingUser((prev) => (prev ? { ...prev, org: e.target.value } : null))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Role</label>
                <Select
                  value={editingUser?.role || ""}
                  onValueChange={(val) =>
                    setEditingUser((prev) =>
                      prev
                        ? { ...prev, role: val, category: val === "Researcher" ? prev.category : "" }
                        : null
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingUser?.role === "Researcher" && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Category</label>
                  <Select
                    value={editingUser?.category || ""}
                    onValueChange={(val) =>
                      setEditingUser((prev) => (prev ? { ...prev, category: val } : null))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mt-6 pt-4 flex">
            {/* Delete button bottom-left with hover slide-in text */}
            {editingUser && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteUser}
                className="relative overflow-hidden w-10 group hover:w-32 transition-all duration-300 ease-in-out flex"
              >
                <Trash2 className="w-4 h-4 text-white z-10 absolute left-3" />
                <span className="absolute left-11 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium whitespace-nowrap">
                  Delete User
                </span>
              </Button>
            )}

            {/* Save Changes bottom-right */}
            <div className="ml-auto w-1/2">
              <RippleButton className="w-full" onClick={handleEditUser}>
                Save Changes
              </RippleButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
