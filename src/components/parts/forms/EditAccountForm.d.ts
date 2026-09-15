export interface EditAccountFormProps {
    user: any;
    fname: string;
    lname: string;
    org: string;
    role: string;
    avatar: string;
    setFname: (v: string) => void;
    setLname: (v: string) => void;
    setOrg: (v: string) => void;
    setRole: (v: string) => void;
    setAvatar: (v: string) => void;
}
export default function EditAccountForm({ user, fname, lname, org, avatar, setFname, setLname, setOrg }: any): import("react/jsx-runtime").JSX.Element;
