'use client'

import type { OptionObject } from 'payload'
import React, { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react'
import {
  formatOptions,
  SelectField,
  SelectInput,
  type SelectInputProps,
} from '@payloadcms/ui/fields/Select'
import { useDocumentInfo, useField, withCondition } from '@payloadcms/ui'

const DEFAULT_STATUS = '待下單'

function optionEnabled(
  optionValue: string,
  baselineStatus: string,
  currentFormValue: string | null | undefined,
): boolean {
  if (currentFormValue != null && optionValue === currentFormValue) return true
  if (baselineStatus === '待確認付款' && optionValue === '待出貨') return true
  if (baselineStatus === '待出貨' && optionValue === '已完成') return true
  return false
}

type OrderStatusFieldProps = ComponentProps<typeof SelectField>

const OrderStatusFieldComponent = (props: OrderStatusFieldProps) => {
  const {
    field: {
      name,
      admin: {
        className,
        description,
        isClearable = true,
        isSortable = true,
        placeholder,
      } = {},
      hasMany = false,
      label,
      localized,
      options: optionsFromProps = [],
      required,
    },
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { initialData } = useDocumentInfo()
  const baselineStatus = useMemo(() => {
    const s = initialData && typeof (initialData as { status?: unknown }).status === 'string'
      ? (initialData as { status: string }).status
      : ''
    return s || DEFAULT_STATUS
  }, [initialData])

  const baseOptions = useMemo(() => formatOptions(optionsFromProps), [optionsFromProps])

  const memoizedValidate = useCallback(
    (value: string | string[] | null | undefined, validationOpts: Record<string, unknown>) => {
      if (typeof validate === 'function') {
        return validate(value, {
          ...validationOpts,
          hasMany,
          options: baseOptions,
          required,
        } as Parameters<NonNullable<typeof validate>>[1])
      }
      return true
    },
    [validate, required, hasMany, baseOptions],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    selectFilterOptions,
    setValue,
    showError,
    value: value_0,
  } = useField<string | string[] | null | undefined>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const options = useMemo(() => {
    if (!hasMounted) {
      return baseOptions
    }
    const current = hasMany ? undefined : (value_0 as string | null | undefined)
    return baseOptions.filter((opt: OptionObject) =>
      optionEnabled(String(opt.value), baselineStatus, current),
    )
  }, [hasMounted, baseOptions, baselineStatus, value_0, hasMany])

  const onChange = useCallback(
    (selectedOption: unknown) => {
      if (!readOnly || disabled) {
        let newValue: string | string[] | null = null
        if (selectedOption && hasMany) {
          if (Array.isArray(selectedOption)) {
            newValue = (selectedOption as { value: string }[]).map((option) => option.value)
          } else {
            newValue = []
          }
        } else if (selectedOption && !Array.isArray(selectedOption)) {
          newValue = (selectedOption as { value: string }).value
        }
        if (typeof onChangeFromProps === 'function') {
          onChangeFromProps(newValue as string | string[])
        }
        setValue(newValue)
      }
    },
    [readOnly, disabled, hasMany, setValue, onChangeFromProps],
  )

  return (
    <SelectInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      description={description}
      Error={Error}
      filterOption={
        selectFilterOptions
          ? ({ label: l, value: v }, search) =>
              Boolean(
                selectFilterOptions?.some((option) =>
                  (typeof option === 'string' ? option : option.value) === v,
                ) && l.toLowerCase().includes(search.toLowerCase()),
              )
          : undefined
      }
      hasMany={hasMany}
      isClearable={Boolean(isClearable)}
      isSortable={Boolean(isSortable)}
      Label={Label}
      label={label as SelectInputProps['label']}
      localized={localized}
      name={name}
      onChange={onChange}
      options={options}
      path={path}
      placeholder={placeholder as SelectInputProps['placeholder']}
      readOnly={Boolean(readOnly || disabled)}
      required={Boolean(required)}
      showError={showError}
      value={value_0 === null ? undefined : value_0}
    />
  )
}

export default withCondition(OrderStatusFieldComponent)
