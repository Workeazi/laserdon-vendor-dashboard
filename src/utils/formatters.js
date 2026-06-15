export const formatCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
export const formatDate = (d) => {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
}
export const truncateFilename = (name, max = 28) => {
  if (!name) return ''
  return name.length > max ? name.slice(0, max) + '...' : name
}
