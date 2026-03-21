import { useEffect } from 'react';
import FullScreenLoader from '@/shared/components/FullScreenLoader';

/**
 * Loaded inside the Faceit OAuth popup.
 * Broadcasts the result to the parent tab via BroadcastChannel,
 * then attempts to close the popup.
 *
 * window.opener is not used — it becomes null after the cross-origin
 * redirect chain (parent → Faceit → backend → here).
 * window.close() may be blocked by the browser after cross-origin
 * navigation. In that case we fallback to the stored return path.
 */
export default function FaceitPopupCallbackPage() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let fallbackTimer: number | null = null;

        const channel = new BroadcastChannel('faceit_oauth');
        channel.postMessage({
            type: 'faceit_callback',
            faceit_result: params.get('faceit_result'),
            faceit_nickname: params.get('faceit_nickname'),
            faceit_reason: params.get('faceit_reason'),
        });
        channel.close();

        // Give the browser time to deliver the message before closing
        const timer = setTimeout(() => {
            window.close();

            // Fallback: if the window cannot close, restore app context.
            fallbackTimer = window.setTimeout(() => {
                const storedReturnPath = sessionStorage.getItem('tw.faceit.returnPath');
                const returnPath = storedReturnPath || '/select-team';

                const callbackParams = new URLSearchParams();
                const result = params.get('faceit_result');
                const nickname = params.get('faceit_nickname');
                const reason = params.get('faceit_reason');

                if (result) callbackParams.set('faceit_result', result);
                if (nickname) callbackParams.set('faceit_nickname', nickname);
                if (reason) callbackParams.set('faceit_reason', reason);

                sessionStorage.removeItem('tw.faceit.returnPath');

                const separator = returnPath.includes('?') ? '&' : '?';
                const target = callbackParams.toString()
                    ? `${returnPath}${separator}${callbackParams.toString()}`
                    : returnPath;

                window.location.replace(target);
            }, 700);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (fallbackTimer !== null) {
                window.clearTimeout(fallbackTimer);
            }
        };
    }, []);

    return <FullScreenLoader />;
}
