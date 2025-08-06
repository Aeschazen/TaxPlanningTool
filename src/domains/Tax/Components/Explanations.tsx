import type {
    ReactNode,
} from 'react'
import Decimal from 'decimal.js'
import { precision } from 'shared/Constants'

export const green = 'green'
export const yellow = 'yellow'
export const red = 'red'

export interface SharedValue{
  topic: string
  totalAmount: Decimal
}

export interface ExplainSharedValueProps extends SharedValue{
  usedBy: SharedValue[]
  remainingAmount: Decimal
}

export function ExplainSharedValue({topic, totalAmount, usedBy, remainingAmount}:ExplainSharedValueProps){
  const usedByNodes: ReactNode[] = usedBy.map((x, i) => <p key={i}>ถูกใช้ใน {x.topic}: <span className={x.totalAmount.gt(0) ? red : yellow}>-{x.totalAmount.toFixed(precision)}</span></p>)
  return (
    <>
      <p>{topic}สูงสุด: <span className={green}>{totalAmount.toFixed(precision)}</span></p>
      {usedByNodes}
      <p>{topic}คงเหลือ: <span className={remainingAmount.gt(0) ? green : yellow}>{remainingAmount.toFixed(precision)}</span></p>
    </>
  )
}

export interface ExplainXPercentOfYProps {
  base: Decimal
  rate: Decimal
  result: Decimal
}

export function ExplainXPercentOfYForIncome({base,rate,result}:ExplainXPercentOfYProps){
  const percentRate = rate.mul(100).toFixed(precision)
  return (
    <p>{percentRate}% ของจำนวนเงินก่อนหักภาษี: {base.toFixed(precision)} × {percentRate}% = <span className={result.gt(0) ? green : yellow}>{result.toFixed(precision)}</span></p>
  )
}

export interface ExplainXPercentOfYPropsTaxDeduction extends ExplainXPercentOfYProps {
  topicPrimary: string
  topicSecondary: string
}

export function ExplainXPercentOfYForTaxDeduction({base,rate,result,topicPrimary,topicSecondary}:ExplainXPercentOfYPropsTaxDeduction){
  const percentRate = rate.mul(100).toFixed(precision)
  return (
    <p>{topicPrimary} {percentRate}% ของจำนวนเงิน{topicSecondary}: {base.toFixed(precision)} × {percentRate}% = <span className={result.gt(0) ? green : yellow}>{result.toFixed(precision)}</span></p>
  )
}

export interface ExplainLimitProps {
  topic: string
  limitAmount: Decimal
  amountOverLimit: Decimal
}

export function ExplainRealExpense({amount}:ExplainNetExpenseProps){
  return (
    <p>ค่าใช้จ่ายตามจริง: <span className={amount.gt(0) ? green : yellow}>{amount.toFixed(precision)}</span></p>
  )
}

export function ExplainLimit({topic,limitAmount,amountOverLimit}:ExplainLimitProps){
  return (
    <p>{topic} {limitAmount.toFixed(precision)}: <span className={amountOverLimit.gt(0) ? red : yellow}>-{amountOverLimit.toFixed(precision)}</span></p>
  )
}

export interface ExplainNetExpenseProps {
  amount: Decimal
}

export function ExplainNetExpense({amount}:ExplainNetExpenseProps){
  return (
    <p>ค่าใช้จ่ายที่หักได้สุทธิ: <span className={amount.gt(0) ? green : yellow}>{amount.toFixed(precision)}</span></p>
  )
}

export function ExplainNetTaxDeductionCap({amount}:ExplainNetExpenseProps){
  return (
    <p>มูลค่าลดหย่อนได้คงเหลือ: <span className={amount.gt(0) ? green : yellow}>{amount.toFixed(precision)}</span></p>
  )
}
