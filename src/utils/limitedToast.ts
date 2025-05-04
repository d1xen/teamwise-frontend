import { toast } from "react-hot-toast";

let currentToasts: string[] = [];

export const limitedToast = {
    success: (message: string) => {
        if (currentToasts.length < 2) {
            const id = toast.success(message);
            currentToasts.push(id);
            setTimeout(() => {
                currentToasts = currentToasts.filter(tid => tid !== id);
            }, 3000);
        }
    },
    error: (message: string) => {
        if (currentToasts.length < 2) {
            const id = toast.error(message);
            currentToasts.push(id);
            setTimeout(() => {
                currentToasts = currentToasts.filter(tid => tid !== id);
            }, 3000);
        }
    },
    info: (message: string) => {
        if (currentToasts.length < 2) {
            const id = toast(message);
            currentToasts.push(id);
            setTimeout(() => {
                currentToasts = currentToasts.filter(tid => tid !== id);
            }, 3000);
        }
    }
};
