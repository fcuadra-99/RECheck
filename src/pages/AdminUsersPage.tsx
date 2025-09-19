"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/DB";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Edit2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

const ROLE_OPTIONS = ["Admin", "Admin Assistant", "Researcher", "Reviewer", "Chairperson"];
const CATEGORY_OPTIONS = ["Undergraduate", "Graduate", "External"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) return console.error(error);

      const usersWithAvatar = data.map(user => {
        const publicUrl = supabase.storage
          .from("profiles")
          .getPublicUrl(`${user.id}/pfp.png`).data.publicUrl;
        return { ...user, avatar: publicUrl || "" };
      });

      setUsers(usersWithAvatar);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.fname.toLowerCase().includes(search.toLowerCase()) ||
      u.lname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.org.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesCategory = categoryFilter ? u.category === categoryFilter : true;

    return matchesSearch && matchesRole && matchesCategory;
  });

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
        category: editingUser.role === "Researcher" ? editingUser.category : "", // category only counts for Researchers
      })
      .eq("id", editingUser.id);

    if (error) {
      toast.error("Failed to update user");
    } else {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
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
      setUsers(prev => prev.filter(u => u.id !== editingUser.id));
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
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />

        <Select value={roleFilter ?? "all"} onValueChange={val => setRoleFilter(val === "all" ? null : val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLE_OPTIONS.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={categoryFilter ?? "all"} onValueChange={val => setCategoryFilter(val === "all" ? null : val)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-gray-200 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-48 bg-gray-200 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-gray-200 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-200 animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.fname[0]}{user.lname[0]}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{user.fname} {user.lname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.org}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={editingUser?.fname || ""}
              onChange={e => setEditingUser(prev => prev ? { ...prev, fname: e.target.value } : null)}
              placeholder="First Name"
            />
            <Input
              value={editingUser?.lname || ""}
              onChange={e => setEditingUser(prev => prev ? { ...prev, lname: e.target.value } : null)}
              placeholder="Last Name"
            />
            <Input
              value={editingUser?.email || ""}
              onChange={e => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
              placeholder="Email"
            />
            <Input
              value={editingUser?.org || ""}
              onChange={e => setEditingUser(prev => prev ? { ...prev, org: e.target.value } : null)}
              placeholder="Organization"
            />

            {/* Role & Category side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                value={editingUser?.role || ""}
                onValueChange={val => setEditingUser(prev => prev ? {
                  ...prev,
                  role: val,
                  category: val === "Researcher" ? prev.category : ""
                } : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {ROLE_OPTIONS.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>

              {editingUser?.role === "Researcher" && (
                <Select
                  value={editingUser?.category || ""}
                  onValueChange={val => setEditingUser(prev => prev ? { ...prev, category: val } : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {CATEGORY_OPTIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between mt-4 pt-10">
            <RippleButton variant="destructive" onClick={handleDeleteUser}>Delete User</RippleButton>
            <RippleButton onClick={handleEditUser}>Save Changes</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
