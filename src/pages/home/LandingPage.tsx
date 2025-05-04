import steamLogo from '../../assets/icon-steam.svg';
import teamwiseLogo from '../../assets/TeamWiseLogo.png';

export default function LandingPage() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-900 text-white px-4">
            <div className="text-center space-y-6 max-w-md -mt-40">
                <div className="relative inline-block overflow-hidden" style={{ lineHeight: 0 }}>
                    <img
                        src={teamwiseLogo}
                        alt="TeamWise Logo"
                        className="mx-auto w-60 h-auto"
                    />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">TeamWise</h1>

                <p className="text-lg text-gray-400">
                    Managez votre équipe <span className="text-white font-semibold">E-Sport</span> comme jamais.
                </p>

                <a
                    href="http://localhost:8080/api/auth/steam"
                    className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-medium py-3 px-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                    <img src={steamLogo} alt="Steam" className="w-6 h-6" />
                    Se connecter
                </a>
            </div>
        </div>
    );
}
