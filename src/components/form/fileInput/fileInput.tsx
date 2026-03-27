import { FC, InputHTMLAttributes, PropsWithChildren } from "react";
import {
  fileInputFace,
  fileInputNative,
  fileInputProgress,
  fileInputWrapper,
} from "./fileInput.css";

export type FileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "type"
> & {
  progress?: number;
};

export const FileInput: FC<PropsWithChildren<FileInputProps>> = ({
  children,
  className,
  progress,
  ...inputProps
}) => (
  <label
    className={
      className ? `${className} ${fileInputWrapper}` : fileInputWrapper
    }
  >
    <span className={fileInputFace}>
      {children}
      {progress != null && (
        <div
          className={fileInputProgress}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      )}
    </span>
    <input {...inputProps} type="file" className={fileInputNative} />
  </label>
);
