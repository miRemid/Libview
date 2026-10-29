import { photoUrl } from '../lib/pocketbase'
import type { Photo } from '../lib/types'

type PhotoGridProps = {
  photos: Photo[]
  onSelect: (photo: Photo) => void
}

export default function PhotoGrid({ photos, onSelect }: PhotoGridProps) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo)}
          className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-mist text-left"
        >
          <img
            src={photoUrl(photo, '1200x0')}
            alt={photo.title || '摄影作品'}
            className="block w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            style={
              photo.width && photo.height
                ? { aspectRatio: `${photo.width} / ${photo.height}` }
                : undefined
            }
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="truncate text-sm text-white">
              {photo.title || '未命名'}
            </p>
            {photo.camera_model ? (
              <p className="mt-0.5 truncate text-xs text-white/75">
                {photo.camera_model}
              </p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}
