import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../lib/api'
import type { Photo } from '../lib/types'

type PhotoGridProps = {
  photos: Photo[]
}

function PhotoCard({ photo, index }: { photo: Photo; index: number }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      to={`/photos/${photo.id}`}
      state={{ fromGallery: true }}
      onClick={() => {
        sessionStorage.setItem('libview:gallery-scroll', String(window.scrollY))
      }}
      className="photo-rise group relative mb-2 block w-full break-inside-avoid overflow-hidden bg-mist text-left lg:mb-4"
      style={{ animationDelay: `${Math.min(index, 16) * 45}ms` }}
    >
      <img
        src={photoUrl(photo, '1200x0')}
        alt={photo.title || '摄影作品'}
        className={`block w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035] ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={
          photo.width && photo.height
            ? { aspectRatio: `${photo.width} / ${photo.height}` }
            : undefined
        }
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-2 opacity-100 transition duration-300 lg:translate-y-1 lg:px-4 lg:py-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
        <p className="truncate text-xs text-white lg:text-sm">
          {photo.title || '未命名'}
        </p>
        {photo.camera_model ? (
          <p className="mt-0.5 truncate text-[10px] text-white/75 lg:text-xs">
            {photo.camera_model}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="columns-2 gap-2 lg:columns-3 lg:gap-4">
      {photos.map((photo, index) => (
        <PhotoCard key={photo.id} photo={photo} index={index} />
      ))}
    </div>
  )
}
