import { BubbleBackground } from "@/components/animate-ui/backgrounds/bubble";
import { RippleButton } from "@/components/animate-ui/buttons/ripple";
import { NotificationList } from '@/components/animate-ui/ui-elements/notification-list';

const SDashboard = () => {
    return (
        <div className="flex-1 [&>*]:my-3">
            <h1 className="text-[30px] font-medium">Dashboard</h1>
            <RippleButton>
                aaaa
            </RippleButton>
            <NotificationList/>
        </div>
    );
};

export default SDashboard;