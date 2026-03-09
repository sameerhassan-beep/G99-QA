import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  FormControl,
  FormLabel,
  useToast,
  VStack,
  HStack,
  Icon,
  Link,
  Text,
  InputGroup,
} from '@chakra-ui/react'
import { PaperClipIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabaseClient'

function FileUpload({ 
  label, 
  value, 
  onUpload, 
  accept = "*", 
  placeholder = "Upload file",
  isReadOnly = false,
  bucketName = 'project-files'
}) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const toast = useToast()

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      onUpload(publicUrl)
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Error uploading file',
        description: error.message || 'Please check if the storage bucket exists and you have write permissions.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClear = () => {
    onUpload('')
  }

  return (
    <FormControl>
      {label && <FormLabel>{label}</FormLabel>}
      <VStack align="stretch" spacing={2}>
        {value ? (
          <HStack p={2} borderWidth={1} borderRadius="md" justify="space-between" bg="gray.50">
            <HStack spacing={2} overflow="hidden">
              <Icon as={PaperClipIcon} color="gray.500" />
              <Link href={value} isExternal color="vrv.500" noOfLines={1} fontSize="sm">
                {value.split('/').pop()}
              </Link>
            </HStack>
            {!isReadOnly && (
              <Icon 
                as={XMarkIcon} 
                cursor="pointer" 
                onClick={handleClear}
                color="red.500" 
                boxSize={5}
              />
            )}
          </HStack>
        ) : (
          <InputGroup>
            <input
              type="file"
              ref={fileInputRef}
              accept={accept}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isReadOnly}
            />
            <Button
              leftIcon={<Icon as={ArrowUpTrayIcon} />}
              onClick={() => fileInputRef.current.click()}
              isLoading={isUploading}
              loadingText="Uploading..."
              width="full"
              isDisabled={isReadOnly}
              variant="outline"
              borderStyle="dashed"
              borderColor="gray.400"
              _hover={{ borderColor: 'vrv.500', bg: 'vrv.50' }}
            >
              {placeholder}
            </Button>
          </InputGroup>
        )}
      </VStack>
    </FormControl>
  )
}

FileUpload.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  accept: PropTypes.string,
  placeholder: PropTypes.string,
  isReadOnly: PropTypes.bool,
  bucketName: PropTypes.string,
}

export default FileUpload
