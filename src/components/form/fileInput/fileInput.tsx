import { FC, InputHTMLAttributes, PropsWithChildren } from "react";
import {
  fileInputFace,
  fileInputNative,
  fileInputWrapper,
} from "./fileInput.css";

export type FileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "className" | "type"
> & {
  className?: string;
};

export const FileInput: FC<PropsWithChildren<FileInputProps>> = ({
  children,
  className,
  ...inputProps
}) => (
  <label className={className ? `${fileInputWrapper} ${className}` : fileInputWrapper}>
    <span className={fileInputFace}>{children}</span>
    <input {...inputProps} type="file" className={fileInputNative} />
  </label>
);
