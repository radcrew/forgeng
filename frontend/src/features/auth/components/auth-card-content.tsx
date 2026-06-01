"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";

import { Button } from "@components/ui/button";
import { CardContent } from "@components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";

import { AuthDivider } from "./auth-divider";
import { AuthPrompt } from "./auth-prompt";
import { OAuthButtons } from "./oauth-buttons";

type AuthField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  /** Optional element rendered to the right of the label (e.g. a link). */
  labelAction?: React.ReactNode;
};

/** A single field, or several fields rendered side-by-side in one row. */
type AuthFieldRow<T extends FieldValues> = AuthField<T> | AuthField<T>[];

type AuthPromptConfig = {
  text: string;
  linkText: string;
  href: string;
};

type AuthCardContentProps<T extends FieldValues> = {
  /** When set, OAuth buttons + a divider render above the form. */
  oauthLabel?: string;
  /** Provide all three (schema, fields, onSubmit) to render a form. */
  schema?: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  fields?: AuthFieldRow<T>[];
  onSubmit?: (values: T) => void | Promise<void>;
  submitLabel?: string;
  pendingLabel?: string;
  /** Footer prompt shown under the form/children. */
  prompt?: AuthPromptConfig;
  /** Non-form body (e.g. a resend button) when no `fields` are given. */
  children?: React.ReactNode;
};

export const AuthCardContent = <T extends FieldValues>({
  oauthLabel,
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel,
  pendingLabel,
  prompt,
  children,
}: AuthCardContentProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<T>({
    // Cast bridges zod v4's input/output generics to RHF's Resolver<T>.
    resolver: schema
      ? (zodResolver(schema as never) as Resolver<T>)
      : undefined,
    defaultValues,
  });

  const hasForm = Boolean(fields && onSubmit);

  const submit = async (values: T) => {
    if (!onSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: AuthField<T>) => (
    <FormField
      key={field.name}
      control={form.control}
      name={field.name}
      render={({ field: controllerField }) => (
        <FormItem>
          {field.labelAction ? (
            <div className="flex items-center justify-between">
              <FormLabel>{field.label}</FormLabel>
              {field.labelAction}
            </div>
          ) : (
            <FormLabel>{field.label}</FormLabel>
          )}
          <FormControl>
            <Input
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              disabled={isSubmitting}
              {...controllerField}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <CardContent className="space-y-4">
      {oauthLabel && (
        <>
          <OAuthButtons disabled={isSubmitting} label={oauthLabel} />
          <AuthDivider />
        </>
      )}

      {hasForm ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="space-y-4"
            noValidate
          >
            {fields?.map((row, index) =>
              Array.isArray(row) ? (
                <div key={index} className="grid grid-cols-2 gap-3">
                  {row.map(renderField)}
                </div>
              ) : (
                renderField(row)
              ),
            )}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? pendingLabel : submitLabel}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            {prompt && <AuthPrompt {...prompt} />}
          </form>
        </Form>
      ) : (
        <>
          {children}
          {prompt && <AuthPrompt {...prompt} />}
        </>
      )}
    </CardContent>
  );
};
