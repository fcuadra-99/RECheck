import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
} from '@/components/animate-ui/headless/dialog';
import React from "react";

let titlee = ""
let researchere = ""
let emaile = ""
let statuse = ""
let submDatee = ""
let reviewere = ""
let typee = ""

export function handleCheck(_title: string, _researcher: string, _email: string, _submDate: string, _reviewer: string, _status: string, _type: string) {
    titlee = _title
    researchere = _researcher
    emaile = _email
    statuse = _status
    submDatee = _submDate
    reviewere = _reviewer
    typee = _type
}


export const SReview = () => {
    const [manuOpen, setmanuOpen] = React.useState(false);
    const [payOpen, setpayOpen] = React.useState(false);
    const [formOpen, setformOpen] = React.useState(false);
    const navigate = useNavigate();
    const [tog, setTog] = useState("approve")
    const [msg, setMsg] = useState("")
    const [title] = useState(titlee)
    const [researcher] = useState(researchere)
    const [email] = useState(emaile)
    const [submDate] = useState(submDatee)
    const [status] = useState(statuse)
    const [reviewer] = useState(reviewere)
    const [type] = useState(typee)

    useEffect(() => {
        if (title == "")
            navigate("/ssubm/sub1")
    }, [])

    function handleSubmit() {
        navigate("/ssubm/sub1")
    }


    return <>
        <main className="m-12">
            <form onSubmit={handleSubmit}>
                <section>
                    <div className="flex gap-2 my-3">
                        <span className="flex-1">
                            <div className="text-muted-foreground">
                                Review Status
                            </div>
                            <div>
                                {status}
                            </div>
                        </span>
                        <span className="flex-1">
                            <div className="text-muted-foreground">
                                Project Title
                            </div>
                            <div>
                                {title}
                            </div>
                        </span>
                    </div>
                    <hr />
                    <div className="flex gap-2 my-3">
                        <span className="flex-1">
                            <div className="text-muted-foreground">
                                Researcher Name
                            </div>
                            <div>
                                {researcher}
                            </div>
                        </span>
                        <span className="flex-1">
                            <div className="text-muted-foreground">
                                Researcher Email
                            </div>
                            <div>
                                {email}
                            </div>
                        </span>
                    </div>
                    <hr />
                    <div className="flex gap-2 my-3">
                        <span className="flex-1">
                            <div className="text-muted-foreground">
                                Submission Date
                            </div>
                            <div>
                                {submDate}
                            </div>
                        </span>
                    </div>
                </section>
                <section className="my-15 mb-10">
                    <h1 className="text-2xl my-10">
                        <b>Review Documents</b>
                    </h1>
                    <span>
                        <div className="flex justify-between my-5">
                            <p className="font-medium">
                                Manuscript
                            </p>
                            <div>
                                <Button variant="outline" type="button" onClick={() => setmanuOpen(true)}>
                                    View Details
                                </Button>

                                <Dialog open={manuOpen} onClose={() => setmanuOpen(false)}>
                                    <DialogBackdrop />

                                    <DialogPanel className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Terms of Service</DialogTitle>
                                            <DialogDescription>
                                                Please read the following terms of service carefully.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-4 py-4">
                                            <p>
                                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                                                quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                                Quisquam, quos.
                                            </p>
                                        </div>
                                    </DialogPanel>
                                </Dialog>
                            </div>
                        </div>
                        <div className="flex justify-between my-5">
                            <p className="font-medium">
                                Payment Receipt
                            </p>
                            <div>
                                <Button variant="outline" type="button" onClick={() => setpayOpen(true)}>
                                    View Details
                                </Button>

                                <Dialog open={payOpen} onClose={() => setpayOpen(false)}>
                                    <DialogBackdrop />

                                    <DialogPanel className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Terms of Service</DialogTitle>
                                            <DialogDescription>
                                                Please read the following terms of service carefully.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-4 py-4">
                                            <p>
                                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                                                quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                                Quisquam, quos.
                                            </p>
                                        </div>
                                    </DialogPanel>
                                </Dialog>
                            </div>
                        </div>
                        <div className="flex justify-between my-5">
                            <p className="font-medium">
                                Forms
                            </p>
                            <div>
                                <Button variant="outline" type="button" onClick={() => setformOpen(true)}>
                                    View Details
                                </Button>

                                <Dialog open={formOpen} onClose={() => setformOpen(false)}>
                                    <DialogBackdrop />

                                    <DialogPanel className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Terms of Service</DialogTitle>
                                            <DialogDescription>
                                                Please read the following terms of service carefully.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="grid gap-4 py-4">
                                            <p>
                                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                                                quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                                Quisquam, quos.
                                            </p>
                                        </div>
                                    </DialogPanel>
                                </Dialog>
                            </div>
                        </div>
                    </span>
                </section>
                <section>
                    <h1 className="text-2xl my-5">
                        <b>Status Management</b>
                    </h1>
                    <span>

                        <RadioGroup
                            defaultValue="approve"
                            value={tog}
                            onValueChange={setTog}
                            onChange={() => { console.log(tog) }}
                        >
                            <div className="bg-card flex px-4 py-5 rounded-xl shadow-sm border-2">
                                <RadioGroupItem value="approve" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                                <div>
                                    <div className="font-medium">Check Manuscript</div>
                                    <div className="text-muted-foreground text-xs">
                                        Queue proposal for Risk Assessment
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card flex px-4 py-5 rounded-xl flex-wrap shadow-sm border-2 space-x-10">
                                <RadioGroupItem value="deny" className="my-auto mr-5 ml-1 w-5 h-5 z-50" />
                                <div className="grow">
                                    <div className="font-medium">Request Revision</div>
                                    <div className="text-muted-foreground text-xs">
                                        Request Researcher to revise their manuscript
                                    </div>
                                </div>

                                <Textarea
                                    placeholder="Type your message here."
                                    className="resize-none mt-4 z-50 wrap-anywhere"
                                    value={msg}
                                    onChange={(event) => setMsg(event.target.value)}
                                    disabled={tog === "approve"}
                                />
                            </div>
                        </RadioGroup>

                    </span>
                </section>

                <section className="absolute my-10 h-20 flex gap-5">
                    <RippleButton type="submit" className="w-20 z-50" hidden={type == "Pending" || type == "View"}>
                        Submit
                    </RippleButton>
                    <RippleButton type="button" variant="outline" className="w-20 z-50" onClick={() => { navigate("/ssubm/sub1") }}>
                        Back
                    </RippleButton>
                </section>
            </form>
        </main >

    </>;
};

export default SReview;