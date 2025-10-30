import React from 'react';
import Select from 'react-select';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value?: Option | null;
    onChange: (option: Option | null) => void;
    placeholder?: string;
    className?: string;
    isDisabled?: boolean;
    isSearchable?: boolean;
}

const defaultStyles = {
    option: (provided: any, state: any) => ({
        ...provided,
        fontWeight: state.isSelected ? "bold" : "normal",
        color: state.isSelected ? "white" : "#333",
        backgroundColor: state.isSelected ? "#6D4AFF" : state.isFocused ? "#f3f4f6" : "white",
        cursor: "pointer",
        padding: "8px 12px",
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: "#333"
    }),
    control: (provided: any) => ({
        ...provided,
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        padding: "2px",
        cursor: "pointer",
        boxShadow: "none",
        "&:hover": {
            border: "1px solid #6D4AFF"
        }
    })
};

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    isDisabled = false,
    isSearchable = true
}) => {
    return (
        <Select
            options={options}
            value={value}
            onChange={onChange}
            styles={defaultStyles}
            placeholder={placeholder}
            className={className}
            isDisabled={isDisabled}
            isSearchable={isSearchable}
        />
    );
};

export default CustomSelect; 