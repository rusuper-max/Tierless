import { InputHTMLAttributes } from "react";
import "./AnimatedCheckbox.css";

interface AnimatedCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export default function AnimatedCheckbox({ label, className = "", ...props }: AnimatedCheckboxProps) {
    return (
        <label className={`tl-checkbox-container ${className}`}>
            <input type="checkbox" {...props} />
            <div className="tl-checkbox-wrapper">
                <div className="tl-nebula-glow" />
                <div className="tl-checkmark" />
                <div className="tl-sparkle-container" />
            </div>
            {label && <span className="tl-checkbox-label">{label}</span>}
        </label>
    );
}
