import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff, Upload, X } from 'lucide-react';
import { SupabaseService, HeroBanner } from '../services/supabase';

const AdminHeroBanners = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    tagline: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    isActive: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Load banners
  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getAllHeroBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading hero banners:', error);
      alert('Failed to load hero banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Open modal for create/edit
  const openModal = (banner?: HeroBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        tagline: banner.tagline,
        title: banner.title,
        subtitle: banner.subtitle,
        buttonText: banner.buttonText,
        buttonLink: banner.buttonLink,
        imageUrl: banner.imageUrl,
        isActive: banner.isActive,
      });
      setImagePreview(banner.imageUrl);
    } else {
      setEditingBanner(null);
      setFormData({
        tagline: '',
        title: '',
        subtitle: '',
        buttonText: '',
        buttonLink: '',
        imageUrl: '',
        isActive: false,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImageFile(null);
    setImagePreview('');
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save banner (create or update)
  const handleSave = async () => {
    if (!formData.tagline || !formData.title || !formData.subtitle || !formData.buttonText || !formData.buttonLink) {
      alert('Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await SupabaseService.uploadHeroBannerImage(imageFile);
      }

      if (!imageUrl) {
        alert('Please upload an image');
        return;
      }

      const bannerData = {
        tagline: formData.tagline,
        title: formData.title,
        subtitle: formData.subtitle,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        imageUrl,
        isActive: formData.isActive,
      };

      if (editingBanner) {
        // Update existing banner
        await SupabaseService.updateHeroBanner(editingBanner.id, bannerData);
      } else {
        // Create new banner
        await SupabaseService.createHeroBanner(bannerData);
      }

      alert(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
      closeModal();
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      await SupabaseService.updateHeroBanner(banner.id, { isActive: !banner.isActive });
      loadBanners();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to toggle active status');
    }
  };

  // Delete banner
  const handleDelete = async (banner: HeroBanner) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      return;
    }

    try {
      await SupabaseService.deleteHeroBanner(banner.id);
      alert('Banner deleted successfully!');
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Hero Banners
          </h1>
          <p className="mt-2 text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
            Manage homepage hero banners. Only one banner can be active at a time.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: 'var(--rank-background)',
            color: 'var(--rank-text)',
          }}
        >
          <Plus size={20} />
          Create New Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ color: 'var(--rating-yellow)' }} />
          <p className="mt-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            Loading banners...
          </p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 theme-card rounded-lg">
          <p className="text-xl mb-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            No hero banners yet
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-2 rounded-lg transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--rank-background)',
              color: 'var(--rank-text)',
            }}
          >
            Create Your First Banner
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="theme-card rounded-lg overflow-hidden"
              style={{
                border: banner.isActive ? '2px solid var(--rating-yellow)' : 'none',
              }}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image Preview */}
                <div className="md:w-1/3">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  {/* Status Badge */}
                  {banner.isActive && (
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{
                        backgroundColor: 'var(--rating-yellow)',
                        color: '#000',
                      }}
                    >
                      ACTIVE
                    </span>
                  )}

                  <p className="text-sm opacity-70 mb-1" style={{ color: 'var(--foreground)' }}>
                    {banner.tagline}
                  </p>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    {banner.title}
                  </h2>
                  <p className="mb-4 opacity-80" style={{ color: 'var(--foreground)' }}>
                    {banner.subtitle}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--rank-background)',
                        color: 'var(--rank-text)',
                      }}
                    >
                      {banner.buttonText}
                    </span>
                    <span className="text-sm opacity-50" style={{ color: 'var(--foreground)' }}>
                      → {banner.buttonLink}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{
                        backgroundColor: banner.isActive ? 'var(--card-background)' : 'var(--rating-green)',
                        color: banner.isActive ? 'var(--foreground)' : '#fff',
                      }}
                      title={banner.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {banner.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      {banner.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openModal(banner)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--rank-background)',
                        color: 'var(--rank-text)',
                      }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--rating-red)',
                        color: '#fff',
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--card-background)' }}>
                    <p className="text-xs opacity-50" style={{ color: 'var(--foreground)' }}>
                      Created: {new Date(banner.createdAt).toLocaleString()} • 
                      Updated: {new Date(banner.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="theme-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-inherit p-6 border-b" style={{ borderColor: 'var(--card-background)' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {editingBanner ? 'Edit Hero Banner' : 'Create Hero Banner'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--foreground)' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Tagline */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g., Welcome to Top Anime Ranks"
                  className="w-full px-4 py-2 rounded-lg theme-input"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Discover the Best Anime"
                  className="w-full px-4 py-2 rounded-lg theme-input"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Subtitle
                </label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g., Weekly rankings updated, featured episodes and the most anticipated anime..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg theme-input"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Button Text (CTA)
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  placeholder="e.g., Explore Now"
                  className="w-full px-4 py-2 rounded-lg theme-input"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Button Link */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Button Link
                </label>
                <input
                  type="text"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                  placeholder="e.g., /weekly-episodes"
                  className="w-full px-4 py-2 rounded-lg theme-input"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Banner Image
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--card-background)',
                      color: 'var(--foreground)',
                      border: '2px dashed rgba(255,255,255,0.2)',
                    }}
                  >
                    <Upload size={20} />
                    {imageFile ? 'Change Image' : 'Upload Image'}
                  </label>

                  {imagePreview && (
                    <div className="relative rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is-active" className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Set as active banner (will deactivate others)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-inherit p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--card-background)' }}>
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-lg transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'var(--card-background)',
                  color: 'var(--foreground)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-6 py-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--rank-background)',
                  color: 'var(--rank-text)',
                }}
              >
                {uploading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeroBanners;
