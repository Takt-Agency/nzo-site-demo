import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSprayCanSparkles,
  faShower,
  faUtensils,
  faShirt,
  faShieldVirus,
  faBroom,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons'

const categoryIcon = {
  surfaces: faSprayCanSparkles,
  bathroom: faShower,
  kitchen: faUtensils,
  laundry: faShirt,
  disinfection: faShieldVirus,
  accessories: faBroom,
}

const categoryGradient = {
  surfaces: 'from-secondary-50 to-secondary-100',
  bathroom: 'from-tertiary-50 to-tertiary-100',
  kitchen: 'from-accent-50 to-accent-100',
  laundry: 'from-primary-50 to-secondary-50',
  disinfection: 'from-secondary-50 to-tertiary-100',
  accessories: 'from-gray-100 to-gray-200',
}

const categoryColor = {
  surfaces: 'text-secondary-600',
  bathroom: 'text-tertiary-600',
  kitchen: 'text-accent-700',
  laundry: 'text-primary-600',
  disinfection: 'text-secondary-700',
  accessories: 'text-gray-500',
}

export default function ProductImage({ category, size = 'md', className = '' }) {
  const icon = categoryIcon[category] ?? faBoxOpen
  const gradient = categoryGradient[category] ?? 'from-gray-100 to-gray-200'
  const color = categoryColor[category] ?? 'text-gray-500'
  const sizes = { sm: 'h-7 w-7', md: 'h-12 w-12', lg: 'h-20 w-20' }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <FontAwesomeIcon icon={icon} className={`${sizes[size]} ${color}`} />
    </div>
  )
}
