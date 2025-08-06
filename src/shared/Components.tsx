import { InputNumber, Modal as AntDModal, Slider as AntDSlider } from 'antd';
import { Decimal } from 'decimal.js'
import clsx from 'clsx'
import type {
    ReactNode,
    PropsWithChildren,
} from 'react';
import { useRef } from 'react';
import { precision } from './Constants';

interface MoneyInputProps extends MoneyDisplayProps{
    max?: Decimal
    onChange: (value: Decimal) => void
}

interface PercentageInputProps extends MoneyInputProps{
    max?: Decimal
}

export function MoneyInput({amount = new Decimal(0), max, onChange}:MoneyInputProps){
    const intermediaryValue = useRef<string | null>(null)
    return (
        <InputNumber
            min="0"
            max={max?.toString()}
            precision={precision}
            value={amount.toFixed(precision)}
            addonAfter="บาท"
            controls={false}
            onChange={value => intermediaryValue.current = value}
            onBlur={() => queueMicrotask(()=> onChange(new Decimal(intermediaryValue.current ?? 0)))}
        />
    )
}

export function PercentageInput({amount = new Decimal(0), max, onChange}:PercentageInputProps){
    const intermediaryValue = useRef<string | null>(null)
    return (
        <InputNumber
            min="0"
            max={max?.toFixed(precision)}
            precision={precision}
            value={amount.toFixed(precision)}
            addonAfter="%"
            controls={false}
            onChange={value => intermediaryValue.current = value}
            onBlur={() => queueMicrotask(()=> onChange(new Decimal(intermediaryValue.current ?? 0)))}
        />
    )
}

export function PercentageDisplay({amount = new Decimal(0)}:MoneyDisplayProps){
    return (
        <InputNumber
            readOnly
            precision={precision}
            value={amount.toFixed(precision)}
            addonAfter="%"
            className={clsx({readonly:true})}
        />
    )
}

interface MoneyDisplayProps{
    amount: Decimal
}

export function MoneyDisplay({amount = new Decimal(0)}:MoneyDisplayProps){
    return (
        <InputNumber
            readOnly
            precision={precision}
            value={amount.toFixed(precision)}
            addonAfter="บาท"
            className={clsx({readonly:true})}
        />
    )
}

interface ExplainableMoneyDisplayProps extends MoneyDisplayProps{
    onClick: () => void
}

export function ExplainableMoneyDisplay({amount = new Decimal(0), onClick}:ExplainableMoneyDisplayProps){
    return (
        <InputNumber
            readOnly
            precision={precision}
            value={amount.toFixed(precision)}
            addonAfter="บาท"
            onClick={onClick}
            className={clsx({readonly:true,explainable: true})}
        />
    )
}

interface SliderProps{
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
}

export function Slider({value, min, max, step, onChange}:SliderProps){
    return (
        <AntDSlider
            marks={{[min]: `${min}`, [max]: `${max}`}}
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={onChange}
        />
    )
}

interface ModalProps {
  children: ReactNode
  open: boolean
  onClose: () => void;
}

export function Modal({open, children, onClose}: PropsWithChildren<ModalProps>){
  return (
      <AntDModal
        title="Information"
        centered
        open={open}
        closable={false}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        onOk={onClose}
        onCancel={onClose}
      >
        {children}
      </AntDModal>
  );
}
