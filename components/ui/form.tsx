"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const Form = FormProvider

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>,
) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const FormItemContext = React.createContext({ id: "" })

function useFormField() {
  const field = React.useContext(FormFieldContext)
  const item = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()
  const state = getFieldState(field.name, formState)

  if (!field.name) throw new Error("useFormField must be used within <FormField>")

  return {
    ...state,
    formDescriptionId: `${item.id}-form-item-description`,
    formItemId: `${item.id}-form-item`,
    formMessageId: `${item.id}-form-item-message`,
    name: field.name,
  }
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()
  return <FormItemContext.Provider value={{ id }}><div data-slot="form-item" className={cn("grid gap-2", className)} {...props} /></FormItemContext.Provider>
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return <Label data-slot="form-label" data-error={Boolean(error)} className={cn("data-[error=true]:text-destructive", className)} htmlFor={formItemId} {...props} />
}

function FormControl(props: React.ComponentProps<typeof Slot.Root>) {
  const { error, formDescriptionId, formItemId, formMessageId } = useFormField()
  return <Slot.Root data-slot="form-control" id={formItemId} aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId} aria-invalid={Boolean(error)} {...props} />
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()
  return <p data-slot="form-description" id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message ?? "") : children
  if (!body) return null
  return <p data-slot="form-message" id={formMessageId} className={cn("text-sm text-destructive", className)} {...props}>{body}</p>
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField }

