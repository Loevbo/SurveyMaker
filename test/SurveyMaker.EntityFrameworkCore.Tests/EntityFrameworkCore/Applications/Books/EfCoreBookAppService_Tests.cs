using SurveyMaker.Books;
using Xunit;

namespace SurveyMaker.EntityFrameworkCore.Applications.Books;

[Collection(SurveyMakerTestConsts.CollectionDefinitionName)]
public class EfCoreBookAppService_Tests : BookAppService_Tests<SurveyMakerEntityFrameworkCoreTestModule>
{

}