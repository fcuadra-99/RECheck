"use client";

import { useState, useEffect, type JSX } from "react";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers, Search, Trash2, User } from "lucide-react";
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
        const { data: publicUrlData } = supabase.storage
          .from("profiles")
          .getPublicUrl(`${user.id}/avatar.png`);
        return { ...user, avatar: publicUrlData.publicUrl || "" };
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
      <h1 className="text-[30px] font-medium mb-4">User Management</h1>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Full-width Search with icon */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search by name, email, or organization"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Dropdowns side by side with icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative w-full">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Select
              value={roleFilter ?? "all"}
              onValueChange={(val) => setRoleFilter(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-full pl-10">
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
          </div>

          <div className="relative w-full">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Select
              value={categoryFilter ?? "all"}
              onValueChange={(val) => setCategoryFilter(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-full pl-10">
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
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="border border-gray-300">
          <TableHeader>
            <TableRow className="border-b border-gray-300">
              <TableHead className="border-r border-gray-300">Avatar</TableHead>
              <TableHead className="border-r border-gray-300">Name</TableHead>
              <TableHead className="border-r border-gray-300">Email</TableHead>
              <TableHead className="border-r border-gray-300">Organization</TableHead>
              <TableHead className="border-r border-gray-300">Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="border-b border-gray-300">
                {/* Avatar */}
                <TableCell className="border-r border-gray-300 text-center align-middle">
                  <div className="flex justify-center">
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarImage src={user.avatar} className="object-cover w-full h-full" />
                      <AvatarFallback>
                        {user.fname[0]}
                        {user.lname[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell className="border-r border-gray-300 text-center align-middle">
                  {user.fname + " " + user.lname}
                </TableCell>

                {/* Email */}
                <TableCell className="border-r border-gray-300 text-center align-middle">
                  {user.email}
                </TableCell>

                {/* Org */}
                <TableCell className="border-r border-gray-300 text-center align-middle">
                  {user.org}
                </TableCell>

                {/* Role w/ icon */}
                <TableCell className="border-r border-gray-300 text-center align-middle">
                  <div className="flex items-center justify-center">
                    {ROLE_ICONS[user.role] ?? <User className="w-4 h-4 mr-2 text-gray-400" />}
                    {user.role}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-center align-middle">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    className="mx-auto flex items-center justify-center"
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
                <Avatar className="h-[120px] w-[120px] m-1 border-3 border-primary">
                  <AvatarImage src={editingUser.avatar} className="object-cover w-full h-full" />
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
                        <div className="flex items-center">
                          {ROLE_ICONS[role] ?? <User className="w-4 h-4 mr-2 text-gray-400" />}
                          {role}
                        </div>
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

import {
  Shield, Users,
  BookOpen, ClipboardCheck, Crown
} from "lucide-react";

// Role → Icon mapping
const ROLE_ICONS: Record<string, JSX.Element> = {
  Admin: <Shield className="w-4 h-4 mr-2 text-primary" />,
  "Admin Assistant": <Users className="w-4 h-4 mr-2 text-blue-500" />,
  Researcher: <BookOpen className="w-4 h-4 mr-2 text-green-500" />,
  Reviewer: <ClipboardCheck className="w-4 h-4 mr-2 text-purple-500" />,
  Chairperson: <Crown className="w-4 h-4 mr-2 text-yellow-500" />,
};