interface ShowDropdownProps {
    label: string;
    icon?: React.ReactNode;
    textColor?: string;
    onClick?: () => void;
}

export default function ShowDropdown({ label, icon, textColor, onClick }: ShowDropdownProps) {
    return(
        <div className="px-2 py-1 hover:bg-gray-100 hover:text-blue-700 rounded-lg ml-2 mr-2 ">
            <button
                onClick={onClick}
                className="flex text-sm">
                {icon}
                <span>{label}</span>
            </button>
        </div>
    );
}