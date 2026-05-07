/**
 * Primitives — Layer 1 of the design system per §7 of the buildout spec.
 *
 * Atomic visual building blocks: minimal logic, maximum composability.
 * Form compounds (FormField, etc.) live in `../forms`; overlays in
 * `../overlays`; feedback in `../feedback`.
 *
 * Note: `TextField` (the legacy RCM compound) is preserved here for
 * backward compatibility with existing RCM-field consumers. New code
 * should compose `Input` + `Label` + form-field error/helper text via the
 * `Form` / `FormField` compounds (§8) instead.
 */
export { Avatar, type AvatarProps } from './Avatar';
export { Button, buttonVariants, type ButtonProps } from './Button';
export { Checkbox, type CheckboxProps } from './Checkbox';
export {
  ExternalLink,
  type ExternalLinkProps,
} from './ExternalLink';
export { Icon, type IconName, type IconProps } from './Icon';
export { IconButton, type IconButtonProps } from './IconButton';
export { Img, type ImgProps } from './Img';
export { Input, type InputProps } from './Input';
export { Label, type LabelProps } from './Label';
export { Link, type LinkProps } from './Link';
export {
  Radio,
  RadioGroup,
  type RadioGroupProps,
  type RadioProps,
} from './Radio';
export { Switch, type SwitchProps } from './Switch';
export { Textarea, type TextareaProps } from './Textarea';
export { TextField, type TextFieldProps } from './TextField';
