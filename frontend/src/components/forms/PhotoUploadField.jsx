import React from "react";
import { FormField } from "./FormField";

export default function PhotoUploadField({
  id,
  label = "Student photo",
  hint = "Optional JPG, PNG, or WebP image up to 5 MB.",
  preview,
  onChange,
  error,
  required = false,
}) {
  return (
    <FormField label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <div className="photo-upload-field">
        <div className="photo-upload-frame" aria-label={`${label} preview`}>
          {preview ? <img src={preview} alt={`${label} preview`} className="photo-upload-image" /> : <span className="photo-upload-placeholder">Passport photo</span>}
        </div>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="ui-form-control" aria-describedby={`${id}-help`} />
        <p id={`${id}-help`} className="photo-upload-help">Use a clear, front-facing portrait. The image is cropped to fit the official ID-card photo area.</p>
      </div>
    </FormField>
  );
}
