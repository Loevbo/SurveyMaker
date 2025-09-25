using AutoMapper;
using SurveyMaker.Books;

namespace SurveyMaker;

public class SurveyMakerApplicationAutoMapperProfile : Profile
{
    public SurveyMakerApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<CreateUpdateBookDto, Book>();
        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
