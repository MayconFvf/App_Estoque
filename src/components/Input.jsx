function Input({ className = '', id, label, name, ...props }) {
  const inputId = id || name

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label && <span className="field__label">{label}</span>}
      <input id={inputId} name={name} className="field__input" {...props} />
    </label>
  )
}

export default Input
