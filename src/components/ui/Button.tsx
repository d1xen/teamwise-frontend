interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export default function Button({ children, ...props }: ButtonProps) {
    return (
        <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
            {...props}
        >
            {children}
        </button>
    );
}