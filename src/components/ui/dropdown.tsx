"use client";
import React, { useState } from 'react';

interface DropdownButtonProps {
    options: string[];
    title: string;
    onSelect: (option: string) => void;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({ options, title, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (option: string) => {
        setSelectedOption(option);
        setIsOpen(false);
        onSelect(option);
    };

    return (
        <div className="relative w-36">
            <button onClick={toggleDropdown} className="bg-blue-500 text-white py-1 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full">
                {selectedOption || title}
            </button>
            {isOpen && (
                <ul className="absolute bg-white shadow-lg mt-1 w-full rounded-md z-10 border border-gray-200">
                    {options.map((option, index) => (
                        <li key={index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleOptionClick(option)}>
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DropdownButton;
